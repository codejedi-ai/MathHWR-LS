export class Event {
  id: string;
  title: string;
  description: string;
  link: string;
  x: number;
  y: number;
  color: string;
  buttonColor: string;
  time?: string;
  createdAt: Date;
  imageUrl?: string;
  variant?: 'sticky' | 'photo' | 'lined';

  constructor(params: {
    id: string;
    title: string;
    description: string;
    link: string;
    x: number;
    y: number;
    color: string;
    buttonColor: string;
    time?: string;
    createdAt: Date;
    imageUrl?: string;
    variant?: 'sticky' | 'photo' | 'lined';
  }) {
    this.id = params.id;
    this.title = params.title;
    this.description = params.description;
    this.link = params.link;
    this.x = params.x;
    this.y = params.y;
    this.color = params.color;
    this.buttonColor = params.buttonColor;
    this.time = params.time;
    this.createdAt = params.createdAt;
    this.imageUrl = params.imageUrl;
    this.variant = params.variant;
  }
}

export class BulletinBoardState {
  events: Event[] = [];
  selectedEvent: Event | null = null;
  isDragging: boolean = false;
}
