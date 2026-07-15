import * as vscode from 'vscode';
import { ExecutionTimer } from './timer';

interface DebugProtocolEvent {
	type?: unknown;
	event?: unknown;
}

const sessionTimers = new Map<string, ExecutionTimer>();
const sessionNames = new Map<string, string>();

let timerStatusBarItem: vscode.StatusBarItem;
let updateInterval: NodeJS.Timeout | undefined;
let displayedSessionId: string | undefined;
let lastElapsedMs: number | undefined;
let lastSessionName: string | undefined;

export function activate(context: vscode.ExtensionContext): void {
	timerStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	timerStatusBarItem.command = 'extension.resetTimer';
	timerStatusBarItem.name = 'Execution Timer';
	setWaitingStatus();
	timerStatusBarItem.show();

	context.subscriptions.push(
		timerStatusBarItem,
		vscode.commands.registerCommand('extension.resetTimer', resetTimer),
		vscode.debug.onDidStartDebugSession(startSession),
		vscode.debug.onDidTerminateDebugSession(finishSession),
		vscode.debug.onDidChangeActiveDebugSession((session) => {
			if (session && sessionTimers.has(session.id)) {
				displayedSessionId = session.id;
			}
			renderStatus();
		}),
		vscode.debug.registerDebugAdapterTrackerFactory('*', {
			createDebugAdapterTracker(session): vscode.ProviderResult<vscode.DebugAdapterTracker> {
				return {
					onDidSendMessage: (message: unknown) => handleDebugProtocolMessage(session, message),
				};
			},
		}),
	);
}

function startSession(session: vscode.DebugSession): void {
	const timer = new ExecutionTimer();
	timer.start();
	sessionTimers.set(session.id, timer);
	sessionNames.set(session.id, session.name);
	displayedSessionId = session.id;
	lastElapsedMs = undefined;
	lastSessionName = session.name;
	startStatusUpdates();
	renderStatus();
}

function finishSession(session: vscode.DebugSession): void {
	const timer = sessionTimers.get(session.id);
	if (!timer) {
		return;
	}

	const elapsedMs = timer.stop();
	sessionTimers.delete(session.id);
	sessionNames.delete(session.id);

	if (displayedSessionId === session.id || sessionTimers.size === 0) {
		lastElapsedMs = elapsedMs;
		lastSessionName = session.name;
		displayedSessionId = chooseSessionToDisplay();
	}

	if (sessionTimers.size === 0) {
		stopStatusUpdates();
	}
	renderStatus();
}

function handleDebugProtocolMessage(session: vscode.DebugSession, message: unknown): void {
	if (!isDebugProtocolEvent(message)) {
		return;
	}

	const timer = sessionTimers.get(session.id);
	if (!timer) {
		return;
	}

	if (message.event === 'stopped') {
		timer.pause();
	} else if (message.event === 'continued') {
		timer.resume();
	} else {
		return;
	}

	if (displayedSessionId === session.id) {
		renderStatus();
	}
}

function isDebugProtocolEvent(message: unknown): message is DebugProtocolEvent {
	if (typeof message !== 'object' || message === null) {
		return false;
	}

	const candidate = message as DebugProtocolEvent;
	return candidate.type === 'event' && typeof candidate.event === 'string';
}

function chooseSessionToDisplay(): string | undefined {
	const activeSessionId = vscode.debug.activeDebugSession?.id;
	if (activeSessionId && sessionTimers.has(activeSessionId)) {
		return activeSessionId;
	}

	return sessionTimers.keys().next().value;
}

function resetTimer(): void {
	const timer = displayedSessionId ? sessionTimers.get(displayedSessionId) : undefined;
	if (!timer) {
		lastElapsedMs = undefined;
		lastSessionName = undefined;
		setWaitingStatus();
		return;
	}

	const wasPaused = timer.isPaused;
	timer.start();
	if (wasPaused) {
		timer.pause();
	}
	renderStatus();
}

function startStatusUpdates(): void {
	if (updateInterval) {
		return;
	}

	updateInterval = setInterval(renderStatus, 100);
}

function stopStatusUpdates(): void {
	if (!updateInterval) {
		return;
	}

	clearInterval(updateInterval);
	updateInterval = undefined;
}

function renderStatus(): void {
	if (!displayedSessionId || !sessionTimers.has(displayedSessionId)) {
		displayedSessionId = chooseSessionToDisplay();
	}

	const sessionId = displayedSessionId;
	const timer = sessionId ? sessionTimers.get(sessionId) : undefined;
	if (sessionId && timer) {
		const pausedLabel = timer.isPaused ? ' (paused)' : '';
		timerStatusBarItem.text = `$(clock) ${formatElapsed(timer.elapsedMs)}${pausedLabel}`;
		timerStatusBarItem.tooltip = `Execution time for ${getSessionName(sessionId)}. Click to reset.`;
		return;
	}

	if (lastElapsedMs !== undefined) {
		timerStatusBarItem.text = `$(clock) ${formatElapsed(lastElapsedMs)}`;
		timerStatusBarItem.tooltip = lastSessionName
			? `Final execution time for ${lastSessionName}. Click to reset.`
			: 'Final execution time. Click to reset.';
		return;
	}

	setWaitingStatus();
}

function getSessionName(sessionId: string): string {
	return sessionNames.get(sessionId) ?? 'debug session';
}

function formatElapsed(elapsedMs: number): string {
	return `${(elapsedMs / 1000).toFixed(2)}s`;
}

function setWaitingStatus(): void {
	timerStatusBarItem.text = '$(clock) Waiting';
	timerStatusBarItem.tooltip = 'Waiting for a debug session. Click to reset.';
}

export function deactivate(): void {
	stopStatusUpdates();
	sessionTimers.clear();
	sessionNames.clear();
}
