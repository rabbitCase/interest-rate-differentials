export interface FredObservation {
  realtime_start: string;
  realtime_end: string;
  date: string;
  value: string;
}

export interface FredApiResponse {
  realtime_start: string;
  realtime_end: string;
  observation_start: string;
  observation_end: string;
  units: string;
  sort_order: string;
  count: number;
  limit: number;
  offset: number;
  observations: FredObservation[];
}

export interface DataPoint {
  date: string;
  rate: number;
}
