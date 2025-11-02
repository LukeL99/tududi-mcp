import { TududuClient } from '../tududi-client.js';

describe('TududuClient', () => {
  let client: TududuClient;

  beforeEach(() => {
    client = new TududuClient('http://localhost:3000', 'test-api-key');
  });

  it('should create a client instance', () => {
    expect(client).toBeInstanceOf(TududuClient);
  });

  // Add more tests as needed
});

