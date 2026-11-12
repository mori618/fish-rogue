// Minimal Test Framework

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    bold: "\x1b[1m"
};

let tests = [];
let passes = 0;
let fails = 0;

function describe(name, fn) {
    tests.push({ type: 'group', name, fn });
}

function it(name, fn) {
    tests.push({ type: 'test', name, fn });
}

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) {
                throw new Error(`Expected ${expected} but got ${actual}`);
            }
        },
        toEqual(expected) {
            const actualStr = JSON.stringify(actual);
            const expectedStr = JSON.stringify(expected);
            if (actualStr !== expectedStr) {
                throw new Error(`Expected ${expectedStr} but got ${actualStr}`);
            }
        },
        toBeTruthy() {
            if (!actual) {
                throw new Error(`Expected ${actual} to be truthy`);
            }
        },
        toBeFalsy() {
            if (actual) {
                throw new Error(`Expected ${actual} to be falsy`);
            }
        },
        toContain(item) {
            if (!Array.isArray(actual)) {
                throw new Error(`Expected array but got ${typeof actual}`);
            }
            if (!actual.includes(item)) {
                throw new Error(`Expected array to contain ${item}`);
            }
        },
        toBeGreaterThan(number) {
            if (actual <= number) {
                throw new Error(`Expected ${actual} to be greater than ${number}`);
            }
        },
        toBeDefined() {
            if (actual === undefined) {
                throw new Error(`Expected value to be defined`);
            }
        },
        get not() {
            return {
                toContain(item) {
                    if (!Array.isArray(actual)) {
                        throw new Error(`Expected array but got ${typeof actual}`);
                    }
                    if (actual.includes(item)) {
                        throw new Error(`Expected array NOT to contain ${item}`);
                    }
                },
                toBe(expected) {
                    if (actual === expected) {
                        throw new Error(`Expected ${actual} NOT to be ${expected}`);
                    }
                }
            };
        }
    };
}

async function run() {
    console.log(`${colors.bold}${colors.blue}=== Running Tests ===${colors.reset}\n`);

    let currentGroup = '';

    for (const item of tests) {
        if (item.type === 'group') {
            currentGroup = item.name;
            console.log(`${colors.bold}${item.name}${colors.reset}`);
            // Describe blocks usually execute immediately to register 'it' blocks in standard frameworks,
            // but here we are flattening the list for simplicity. 
            // NOTE: A recursive structure would be better for nested describes, 
            // but for this simple implementation, we assume top-level describes only.

            // However, to support 'describe' wrapping 'it', we need to run the fn immediately
            // to populate the 'it's. But here 'describe' is just a label in the list?
            // Wait, standard 'describe' runs the callback to register 'it's.
            // Let's refactor slightly to be more standard.
        }
    }
}

// Improved Runner Logic
const globalTests = [];
let currentSuite = null;

const framework = {
    describe: (name, fn) => {
        currentSuite = { name, tests: [] };
        globalTests.push(currentSuite);
        fn(); // Execute function to register tests
        currentSuite = null;
    },

    it: (name, fn) => {
        if (currentSuite) {
            currentSuite.tests.push({ name, fn });
        } else {
            // Standalone test
            globalTests.push({ name: 'Root', tests: [{ name, fn }] });
        }
    },

    expect,

    runAll: async () => {
        console.log(`${colors.bold}${colors.blue}=== Running Tests ===${colors.reset}\n`);
        let totalPass = 0;
        let totalFail = 0;

        for (const suite of globalTests) {
            console.log(`${colors.bold}# ${suite.name}${colors.reset}`);

            for (const test of suite.tests) {
                try {
                    await test.fn();
                    console.log(`  ${colors.green}✓${colors.reset} ${test.name}`);
                    totalPass++;
                } catch (e) {
                    console.log(`  ${colors.red}✗${colors.reset} ${test.name}`);
                    console.log(`    ${colors.red}${e.message}${colors.reset}`);
                    totalFail++;
                }
            }
            console.log(''); // newline
        }

        console.log(`${colors.bold}Result:${colors.reset} ${colors.green}${totalPass} Passed${colors.reset}, ${colors.red}${totalFail} Failed${colors.reset}`);

        if (totalFail > 0) process.exit(1);
    }
};

module.exports = framework;
