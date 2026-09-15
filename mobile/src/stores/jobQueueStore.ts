import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type JobType = 'ANALYZE_TRANSACTION';

export interface Job {
  id: string;
  type: JobType;
  payload: any;
  status: 'pending' | 'failed';
  createdAt: string;
  retryCount: number;
}

interface JobQueueState {
  jobs: Job[];
  addJob: (type: JobType, payload: any) => void;
  removeJob: (id: string) => void;
  markJobFailed: (id: string) => void;
  getPendingJobs: () => Job[];
}

export const useJobQueueStore = create<JobQueueState>()(
  persist(
    (set, get) => ({
      jobs: [],

      addJob: (type, payload) => {
        const newJob: Job = {
          id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type,
          payload,
          status: 'pending',
          createdAt: new Date().toISOString(),
          retryCount: 0,
        };

        set((state) => ({
          jobs: [...state.jobs, newJob],
        }));
      },

      removeJob: (id) => {
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== id),
        }));
      },

      markJobFailed: (id) => {
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id
              ? { ...job, status: 'failed', retryCount: job.retryCount + 1 }
              : job
          ),
        }));
      },

      getPendingJobs: () => {
        return get().jobs.filter((job) => job.status === 'pending' || job.status === 'failed');
      },
    }),
    {
      name: 'carterinha-job-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
