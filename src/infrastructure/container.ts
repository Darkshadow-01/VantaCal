import type { IEventRepository } from "@/src/domain/calendar/interfaces/IEventRepository";
import type { IStoragePort } from "@/src/domain/calendar/interfaces/IStoragePort";
import type { IAIServicePort } from "@/src/domain/ai/interfaces/IAIServicePort";
import { CreateEventUseCase } from "@/src/domain/calendar/useCases/CreateEventUseCase";
import { ScheduleWithAIUseCase, ManageFocusUseCase } from "@/src/useCases";

interface Container {
  eventRepository: IEventRepository;
  storageAdapter: IStoragePort;
  aiService: IAIServicePort;
}

let container: Container | null = null;

export function initContainer(config: {
  eventRepository?: IEventRepository;
  storageAdapter?: IStoragePort;
  aiService?: IAIServicePort;
}): Container {
  container = {
    eventRepository: config.eventRepository!,
    storageAdapter: config.storageAdapter!,
    aiService: config.aiService!,
  };
  return container;
}

export function getContainer(): Container {
  if (!container) {
    throw new Error("Container not initialized. Call initContainer first.");
  }
  return container;
}

export function createEventUseCase(): CreateEventUseCase {
  const { eventRepository } = getContainer();
  return new CreateEventUseCase(eventRepository);
}

export function createScheduleWithAIUseCase(): ScheduleWithAIUseCase {
  const { eventRepository, aiService } = getContainer();
  return new ScheduleWithAIUseCase(eventRepository, aiService);
}

export function createManageFocusUseCase(): ManageFocusUseCase {
  return new ManageFocusUseCase();
}

export { type Container };