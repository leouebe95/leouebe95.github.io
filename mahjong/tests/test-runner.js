// -*- coding: utf-8 -*-

/**
 * Lightweight, zero-dependency browser test runner.
 */
class TestRunner {
    constructor() {
        this.suites = [];
        this.currentSuite = null;
        this.totalPassed = 0;
        this.totalFailed = 0;
        this.totalDuration = 0;
    }

    describe(name, fn) {
        const suite = { name, tests: [], passed: 0, failed: 0 };
        this.suites.push(suite);
        this.currentSuite = suite;
        try {
            fn();
        } catch (e) {
            console.error(`Error in suite "${name}":`, e);
        }
        this.currentSuite = null;
    }

    it(name, fn) {
        if (!this.currentSuite) {
            throw new Error(`"it" must be called inside a "describe" block: ${name}`);
        }
        this.currentSuite.tests.push({ name, fn });
    }

    async run() {
        const startTime = performance.now();
        this.totalPassed = 0;
        this.totalFailed = 0;

        for (const suite of this.suites) {
            for (const test of suite.tests) {
                const testStart = performance.now();
                try {
                    await test.fn();
                    test.passed = true;
                    test.duration = performance.now() - testStart;
                    suite.passed++;
                    this.totalPassed++;
                } catch (err) {
                    test.passed = false;
                    test.error = err;
                    test.duration = performance.now() - testStart;
                    suite.failed++;
                    this.totalFailed++;
                }
            }
        }
        this.totalDuration = performance.now() - startTime;
        return {
            suites: this.suites,
            totalPassed: this.totalPassed,
            totalFailed: this.totalFailed,
            totalDuration: this.totalDuration
        };
    }
}

export const runner = new TestRunner();
export const describe = (name, fn) => runner.describe(name, fn);
export const it = (name, fn) => runner.it(name, fn);

/**
 * Clean assertion library.
 */
export const assert = {
    equal(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(`${message} - Expected: ${expected} (${typeof expected}), but got: ${actual} (${typeof actual})`);
        }
    },
    deepEqual(actual, expected, message = '') {
        const aStr = JSON.stringify(actual);
        const eStr = JSON.stringify(expected);
        if (aStr !== eStr) {
            throw new Error(`${message} - Expected: ${eStr}, but got: ${aStr}`);
        }
    },
    ok(value, message = '') {
        if (!value) {
            throw new Error(`${message} - Expected truthy, but got: ${value}`);
        }
    },
    isTrue(value, message = '') {
        assert.equal(value, true, message);
    },
    isFalse(value, message = '') {
        assert.equal(value, false, message);
    },
    greaterThan(actual, expected, message = '') {
        if (!(actual > expected)) {
            throw new Error(`${message} - Expected ${actual} > ${expected}`);
        }
    }
};
