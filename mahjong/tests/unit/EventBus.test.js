import { describe, it, assert } from '../test-runner.js';
import { EventBus } from '../../src/utils/EventBus.js';

describe('Unit: EventBus', () => {
    it('notifies subscribers with the emitted payload', () => {
        const bus = new EventBus();
        let received;
        bus.on('changed', value => {
            received = value;
        });

        bus.emit('changed', { value: 3 });

        assert.deepEqual(received, { value: 3 });
    });

    it('stops notifying a subscriber after its unsubscribe function is called', () => {
        const bus = new EventBus();
        let callCount = 0;
        const unsubscribe = bus.on('changed', () => {
            callCount++;
        });

        unsubscribe();
        bus.emit('changed');

        assert.equal(callCount, 0);
    });
});
