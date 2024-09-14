import * as vscode from 'vscode';

let startTime: number | undefined;
let totalPausedTime: number = 0;
let pauseStartTime: number | undefined;
let timerStatusBarItem: vscode.StatusBarItem;
let interval: NodeJS.Timeout | undefined;
let isPaused: boolean = false;

export function activate(context: vscode.ExtensionContext) {
	timerStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	timerStatusBarItem.command = 'extension.resetTimer';
	timerStatusBarItem.text = '$(clock) Waiting';
	timerStatusBarItem.show();
	context.subscriptions.push(timerStatusBarItem);

	let disposable = vscode.commands.registerCommand('extension.resetTimer', () => {
		resetTimer();
	});
	context.subscriptions.push(disposable);

	vscode.debug.onDidStartDebugSession(() => {
		startTimer();
	});

	vscode.debug.onDidTerminateDebugSession(() => {
		stopTimer();
	});

	vscode.debug.onDidChangeActiveDebugSession((session) => {
		if (session && !isPaused) {
			checkForPausedThreads(session);
		}
	});
}

async function checkForPausedThreads(session: vscode.DebugSession) {
	const threads = await session.customRequest('threads');
	for (const thread of threads.threads) {
		if (thread.state === 'paused' && !isPaused) {
			pauseStartTime = Date.now();
			isPaused = true;
			stopInterval();
			return;
		} else if (thread.state === 'running' && isPaused) {
			const pauseEndTime = Date.now();
			if (pauseStartTime) {
				totalPausedTime += pauseEndTime - pauseStartTime;
			}
			isPaused = false;
			startInterval();
			return;
		}
	}
}

function startTimer() {
	startTime = Date.now();
	totalPausedTime = 0;
	startInterval();
}

function startInterval() {
	interval = setInterval(() => {
		if (startTime) {
			const currentTime = Date.now();
			const elapsed = (currentTime - startTime - totalPausedTime) / 1000;
			timerStatusBarItem.text = `$(clock) ${elapsed.toFixed(2)}s`;
		}
	}, 100);
}

function stopTimer() {
	stopInterval();
	startTime = undefined;
	totalPausedTime = 0;
}

function stopInterval() {
	if (interval) {
		clearInterval(interval);
		interval = undefined;
	}
}

function resetTimer() {
	stopTimer();
	timerStatusBarItem.text = '$(clock) Waiting';
}

export function deactivate() {
	stopTimer();
}
