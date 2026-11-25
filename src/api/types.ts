export type RawDayRef = 'm' | 'tu' | 'w' | 'th' | 'f' | 'sa' | 'su';

export interface RawGroupRef {
  id: number;
  train_prog: string;
  name: string;
  is_structural: boolean;
}

export interface RawScheduledCourse {
  id: number;
  room: { id: number; name: string } | null;
  start_time: number;
  day: RawDayRef;
  tutor: string | null;
  id_visio: number | null;
  number: number;
  course: {
    id: number;
    type: string;
    room_type: string | null;
    week: number;
    year: number;
    groups: RawGroupRef[];
    supp_tutor: { username: string }[];
    module: {
      name: string;
      abbrev: string;
      display: { color_bg: string; color_txt: string } | null;
    } | null;
    pay_module: { abbrev: string } | null;
    is_graded: boolean;
  };
}

export type RawConstraints = Record<string, { duration: number }>;

export interface RawGroupNode {
  name: string;
  parent?: string;
  promo?: string;
  promotxt?: string;
  buttxt?: string;
  row?: number;
  children?: RawGroupNode[];
}

export interface RawTransversal {
  id: number;
  train_prog: string;
  name: string;
  conflicting_groups: { name: string }[];
}

export interface RawTutor {
  username: string;
  first_name: string;
  last_name: string;
  departments: { abbrev: string }[];
}

export interface RawModule {
  abbrev: string;
  name: string;
  promo: string;
  resp: string | null;
  resp_first_name: string | null;
  resp_last_name: string | null;
  description: string | null;
}

export interface RawRooms {
  roomtypes: Record<string, string[]>;
}
