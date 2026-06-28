export interface Point {
  x: number;
  y: number;
}

export interface Room {
  label: string;
  p1: Point; // top-left
  p2: Point; // bottom-right
  metadata?: Record<string, any>;
}

export interface Floor {
  name: string;
  rooms: Room[];
}

export interface Plan {
  units: 'meters' | 'feet';
  rooms?: Room[];
  floors?: Floor[];
}
