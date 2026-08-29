import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SceneFrame } from "./engine/renderer";
import {
  addAgent,
  addProject,
  addTask,
  assignAgentToProject,
  exportState,
  importState,
  loadState,
  resetState,
  saveState,
  setAgentBreak,
} from "./store";
import { agentActionLabel, createMotion, tickSimulation } from "./simulation";
import type { AgentMotion, JobState, Particle, WorkKind } from "./types";
import { WORK_KINDS } from "./types";
import { applyGithubSnapshot, fetchGithubSnapshot } from "./github";
import { applyDeviceSnapshot, fetchDeviceSnapshot } from "./device";
import { projectProgress, tasksForProject } from "./lib/progress";

const SAVE_MS = 800;

function emptyFrame(state: JobState, motions: AgentMotion[], particles: Particle[]): SceneFrame {
  const project = state.projects.find((item) => item.id === state.selectedProjectId) ?? state.projects[0];
  return {
    project: project ?? {
      id: "none",
      name: "No job",
      site: "",
      floors: 1,
      status: "planning",
      notes: "",
    },
    tasks: project ? tasksForProject(state.tasks, project.id) : [],
    agents: state.agents,
    motions,
    particles,
    now: 0,
    selectedAgentId: null,
  };
}

export function useJobSite() {
  const [state, setState] = useState<JobState>(() => loadState());
  const [motions, setMotions] = useState<AgentMotion[]>(() =>
    createMotion(state.agents, state.tasks),
  );
  const [githubStatus, setGithubStatus] = useState<"loading" | "live" | "offline">("loading");
  const [deviceStatus, setDeviceStatus] = useState<"loading" | "live" | "offline">("loading");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const stateRef = useRef(state);
  const motionsRef = useRef(motions);
  const particlesRef = useRef<Particle[]>([]);
  const selectedAgentRef = useRef(selectedAgentId);
  const sceneRef = useRef<SceneFrame>(emptyFrame(state, motions, []));

  stateRef.current = state;
  motionsRef.current = motions;
  selectedAgentRef.current = selectedAgentId;

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let uiAcc = 0;
    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;
      const result = tickSimulation(
        stateRef.current,
        motionsRef.current,
        particlesRef.current,
        dt,
      );
      stateRef.current = result.state;
      motionsRef.current = result.motions;
      particlesRef.current = result.particles;
      const project =
        result.state.projects.find((item) => item.id === result.state.selectedProjectId) ??
        result.state.projects[0];
      sceneRef.current = {
        project: project ?? sceneRef.current.project,
        tasks: project ? tasksForProject(result.state.tasks, project.id) : [],
        agents: result.state.agents,
        motions: result.motions,
        particles: result.particles,
        now: time,
        selectedAgentId: selectedAgentRef.current,
      };
      uiAcc += dt;
      if (result.placed || uiAcc > 0.16) {
        uiAcc = 0;
        setState(result.state);
        setMotions(result.motions);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => saveState(stateRef.current), SAVE_MS);
    return () => window.clearTimeout(handle);
  }, [state]);

  const patch = useCallback((updater: (current: JobState) => JobState) => {
    const next = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const snapshot = await fetchGithubSnapshot();
        if (cancelled) return;
        setGithubStatus("live");
        patch((current) => applyGithubSnapshot(current, snapshot));
      } catch {
        if (!cancelled) setGithubStatus("offline");
      }
    };
    void pull();
    const timer = window.setInterval(() => void pull(), 45000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [patch]);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      try {
        const snapshot = await fetchDeviceSnapshot();
        if (cancelled) return;
        setDeviceStatus("live");
        patch((current) => applyDeviceSnapshot(current, snapshot));
      } catch {
        if (!cancelled) setDeviceStatus("offline");
      }
    };
    void pull();
    const timer = window.setInterval(() => void pull(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [patch]);

  const selectedProject = useMemo(
    () =>
      state.projects.find((project) => project.id === state.selectedProjectId) ??
      state.projects[0],
    [state.projects, state.selectedProjectId],
  );

  const selectedTasks = useMemo(
    () => (selectedProject ? tasksForProject(state.tasks, selectedProject.id) : []),
    [selectedProject, state.tasks],
  );

  const progressByProject = useMemo(() => {
    const map: Record<string, number> = {};
    for (const project of state.projects) {
      map[project.id] = projectProgress(
        tasksForProject(state.tasks, project.id),
        project.floors,
      );
    }
    return map;
  }, [state.projects, state.tasks]);

  const selectProject = useCallback((id: string) => {
    patch((current) => ({ ...current, selectedProjectId: id }));
  }, [patch]);

  const setPaused = useCallback((paused: boolean) => {
    patch((current) => ({ ...current, paused }));
  }, [patch]);

  const setSpeed = useCallback((speed: 1 | 2 | 4) => {
    patch((current) => ({ ...current, speed }));
  }, [patch]);

  const createJob = useCallback(
    (input: { name: string; site: string; floors: number; notes?: string }) => {
      patch((current) => addProject(current, input));
    },
    [patch],
  );

  const createAgent = useCallback(
    (input: { name: string; trade: WorkKind; projectId: string | null }) => {
      patch((current) => {
        const next = addAgent(current, input);
        const existing = new Map(motionsRef.current.map((motion) => [motion.agentId, motion]));
        motionsRef.current = next.agents.map(
          (agent) => existing.get(agent.id) ?? createMotion([agent], next.tasks)[0],
        );
        return next;
      });
    },
    [patch],
  );

  const createTask = useCallback(
    (input: {
      projectId: string;
      title: string;
      workKind: WorkKind;
      floor: number;
      assigneeId: string | null;
    }) => {
      patch((current) => addTask(current, input));
    },
    [patch],
  );

  const toggleBreak = useCallback((agentId: string) => {
    patch((current) => {
      const agent = current.agents.find((item) => item.id === agentId);
      return setAgentBreak(current, agentId, agent?.status !== "break");
    });
  }, [patch]);

  const moveAgent = useCallback((agentId: string, projectId: string | null) => {
    patch((current) => assignAgentToProject(current, agentId, projectId));
  }, [patch]);

  const reset = useCallback(() => {
    const next = resetState();
    stateRef.current = next;
    motionsRef.current = createMotion(next.agents, next.tasks);
    particlesRef.current = [];
    setState(next);
    setMotions(motionsRef.current);
  }, []);

  const download = useCallback(() => {
    const blob = new Blob([exportState(stateRef.current)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "jobs-crew.json";
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const upload = useCallback((file: File) => {
    void file.text().then((text) => {
      const next = importState(text);
      stateRef.current = next;
      motionsRef.current = createMotion(next.agents, next.tasks);
      setState(next);
      setMotions(motionsRef.current);
    });
  }, []);

  return {
    state,
    motions,
    sceneRef,
    selectedProject,
    selectedTasks,
    progressByProject,
    selectedAgentId,
    setSelectedAgentId,
    selectProject,
    setPaused,
    setSpeed,
    createJob,
    createAgent,
    createTask,
    toggleBreak,
    moveAgent,
    reset,
    download,
    upload,
    githubStatus,
    deviceStatus,
    kinds: WORK_KINDS,
    actionFor: (agentId: string) => {
      const agent = state.agents.find((item) => item.id === agentId);
      if (!agent) return "";
      const task = state.tasks.find((item) => item.id === agent.taskId);
      const motion = motions.find((item) => item.agentId === agentId);
      return agentActionLabel(agent, task, motion);
    },
  };
}

export type JobSiteApi = ReturnType<typeof useJobSite>;
