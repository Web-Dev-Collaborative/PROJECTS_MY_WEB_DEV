# p-synchronize 

> Limit async function invocations to one at a time

(with a nod to sindresorhus for https://github.com/sindresorhus/promise-fun)

## Install

```
$ npm install p-synchronize
```

## Usage

```js
const pSynchronize = require('p-synchronize');

const sync = pSynchronize();

const recalibrate = sync(async (options) => {
    // ... some long operation
    return options.call;
});

const input = [
	recalibrate({call: 1}),
	recalibrate({call: 2}),
	recalibrate({call: 3}),
];

(async () => {
	// Only one recalibration is run at once
	const result = await Promise.all(input);
	console.log(result);
})();
// --> [1, 2, 3]
```

## API

### sync = pSynchronize()

Returns a synchronizer.

### fn = sync(async (..) => { ... })

Wraps the enclosed function such that one wrapped function may be executing at any time.

## FAQ

### How is this different from the [`p-limit`](https://github.com/sindresorhus/p-limit) package?

This package is similar, but expresses the one-at-a-time behavior more naturally.

### How can I know that the synchronized operations are complete?

For example, in an object implementing a service, you may want a clean way to shut down the service.
`p-synchronize` can synchronize multiple functions, so just synchronize an empty function:

```js
class Service {
    constructor() {
        this.sync = pSynchronize();
        this.recalibrate = this.sync(() => this.recalibrate());
    }

    async stop() {
        // ensure no more calls will occur
        this.recalibrate = async () => {
            throw new Error("Serivce is stopped");
        };
        // wait for all pending calls to complete
        await this.sync(() => {})();
    }
}
```

## Related

- [p-limit](https://github.com/sindresorhus/p-limit) - Promises with limited concurrency
- [More…](https://github.com/sindresorhus/promise-fun)
