import assert from 'node:assert/strict';
import test from 'node:test';
import { ExecutionTimer } from '../timer';

test('tracks elapsed running time', () => {
	let now = 1_000;
	const timer = new ExecutionTimer(() => now);

	timer.start();
	now = 2_250;

	assert.equal(timer.elapsedMs, 1_250);
	assert.equal(timer.isRunning, true);
	assert.equal(timer.isPaused, false);
});

test('excludes time spent paused', () => {
	let now = 0;
	const timer = new ExecutionTimer(() => now);

	timer.start();
	now = 500;
	timer.pause();
	now = 2_000;
	assert.equal(timer.elapsedMs, 500);

	timer.resume();
	now = 2_750;
	assert.equal(timer.elapsedMs, 1_250);
});

test('ignores duplicate pause and resume events', () => {
	let now = 0;
	const timer = new ExecutionTimer(() => now);

	timer.start();
	now = 100;
	timer.pause();
	now = 200;
	timer.pause();
	now = 300;
	timer.resume();
	now = 400;
	timer.resume();
	now = 500;

	assert.equal(timer.elapsedMs, 300);
});

test('preserves the final elapsed time after stop', () => {
	let now = 100;
	const timer = new ExecutionTimer(() => now);

	timer.start();
	now = 900;
	assert.equal(timer.stop(), 800);
	now = 5_000;

	assert.equal(timer.elapsedMs, 800);
	assert.equal(timer.stop(), 800);
	assert.equal(timer.isRunning, false);
});

test('start fully resets a previous timer state', () => {
	let now = 0;
	const timer = new ExecutionTimer(() => now);

	timer.start();
	now = 100;
	timer.pause();
	now = 1_000;
	timer.start();
	now = 1_250;

	assert.equal(timer.elapsedMs, 250);
	assert.equal(timer.isPaused, false);
});
