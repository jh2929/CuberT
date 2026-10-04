import { CubeEventId } from './event';

export interface Session {
  id: string;
  name: string;
  event: CubeEventId;
  createdAt: number;
  description?: string;
}
