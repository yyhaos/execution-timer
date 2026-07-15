export type Clock = () => number;

export class ExecutionTimer {
	private startedAt: number | undefined;
	private pausedAt: number | undefined;
	private accumulatedPausedMs = 0;
	private finalElapsedMs = 0;

	public constructor(private readonly now: Clock = Date.now) {}

	public get isRunning(): boolean {
		return this.startedAt !== undefined;
	}

	public get isPaused(): boolean {
		return this.isRunning && this.pausedAt !== undefined;
	}

	public get elapsedMs(): number {
		if (this.startedAt === undefined) {
			return this.finalElapsedMs;
		}

		const end = this.pausedAt ?? this.now();
		return Math.max(0, end - this.startedAt - this.accumulatedPausedMs);
	}

	public start(): void {
		this.startedAt = this.now();
		this.pausedAt = undefined;
		this.accumulatedPausedMs = 0;
		this.finalElapsedMs = 0;
	}

	public pause(): void {
		if (!this.isRunning || this.pausedAt !== undefined) {
			return;
		}

		this.pausedAt = this.now();
	}

	public resume(): void {
		if (this.startedAt === undefined || this.pausedAt === undefined) {
			return;
		}

		this.accumulatedPausedMs += Math.max(0, this.now() - this.pausedAt);
		this.pausedAt = undefined;
	}

	public stop(): number {
		if (this.startedAt === undefined) {
			return this.finalElapsedMs;
		}

		this.finalElapsedMs = this.elapsedMs;
		this.startedAt = undefined;
		this.pausedAt = undefined;
		this.accumulatedPausedMs = 0;
		return this.finalElapsedMs;
	}

	public reset(): void {
		this.startedAt = undefined;
		this.pausedAt = undefined;
		this.accumulatedPausedMs = 0;
		this.finalElapsedMs = 0;
	}
}
