import { TestBed } from '@angular/core/testing';

import { ChatboxServiceService } from './chatbox-service.service';

describe('ChatboxServiceService', () => {
  let service: ChatboxServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatboxServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
