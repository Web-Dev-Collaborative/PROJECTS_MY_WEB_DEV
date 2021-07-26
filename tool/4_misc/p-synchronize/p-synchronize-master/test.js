import test from 'ava';
import delay from 'delay';
import allSettled from 'promise.allsettled';
import pSynchronize from '.';

allSettled.shim();

const testfunc = (name, events) => async i => {
	events.push(`${name}-start:${i}`);
	await delay(1);
	if (i < 0) {
		throw new Error(`${name}-err:${i}`);
	}

	events.push(`${name}-end:${i}`);
	return i * 2;
};

test('sync one function', async t => {
	const sync = pSynchronize();
	const events = [];
	const f = sync(testfunc('f', events));

	t.deepEqual(
		await Promise.all([f(1), f(2), f(3)]),
		[2, 4, 6]);
	t.deepEqual(events, [
		'f-start:1',
		'f-end:1',
		'f-start:2',
		'f-end:2',
		'f-start:3',
		'f-end:3'
	]);
});

test('sync several functions', async t => {
	const sync = pSynchronize();
	const events = [];
	const f = sync(testfunc('f', events));
	const g = sync(testfunc('g', events));

	t.deepEqual(
		await Promise.all([f(1), g(1), f(2)]),
		[2, 2, 4]);
	t.deepEqual(events, [
		'f-start:1',
		'f-end:1',
		'g-start:1',
		'g-end:1',
		'f-start:2',
		'f-end:2'
	]);
});

test('continue after errors', async t => {
	const sync = pSynchronize();
	const events = [];
	const f = sync(testfunc('f', events));

	t.deepEqual(
		await Promise.allSettled([f(1), f(2), f(-3), f(4)]),
		[
			{status: 'fulfilled', value: 2},
			{status: 'fulfilled', value: 4},
			{status: 'rejected', reason: new Error('f-err:-3')},
			{status: 'fulfilled', value: 8}
		]);
	t.deepEqual(events, [
		'f-start:1',
		'f-end:1',
		'f-start:2',
		'f-end:2',
		'f-start:-3',
		'f-start:4',
		'f-end:4'
	]);
});
