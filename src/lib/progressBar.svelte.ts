export class ProgressBar {
	fraction = $state(0);
	//done = $state(false);
	started = $state(false);

	reset() {
		this.fraction = 0;
		//this.done = false;
		this.started = false;
	}

	countUp(totalTimeMs: number): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (this.started) {
				reject(new Error("Another progress bar is already running of this object"));
			}
			this.fraction = 0;
			//this.done = false;
			this.started = true;
			let start: number | undefined;
			const step = (timestamp: DOMHighResTimeStamp) => {
				if (!this.started) {
					this.fraction = 0;
					//this.done = false;
					resolve(false);
					return;
				}
				if (start === undefined) {
					start = timestamp;
				}
				const elapsed = timestamp - start;

				this.fraction = elapsed / totalTimeMs;

				if (elapsed < totalTimeMs) {
					window.requestAnimationFrame(step);
				} else {
					this.started = false;
					//this.done = true;
					this.fraction = 1;
					resolve(true);
				}
			};

			window.requestAnimationFrame(step);
		});
	}

	cancel() {
		this.started = false;
	}
}
