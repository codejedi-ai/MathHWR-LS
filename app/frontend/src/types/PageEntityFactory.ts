import { Event } from './Event';
import { PageEntity } from './PageEntity';
import { EventEntity } from './EventEntity';

export class PageEntityFactory {
  static create(e: Event): PageEntity {
    // TODO: branch to Community entity if needed later
    return new EventEntity(e);
  }
}


