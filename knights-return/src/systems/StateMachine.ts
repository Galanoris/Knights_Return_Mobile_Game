export interface State {
  onEnter?: () => void;
  onUpdate?: (delta: number) => void;
  onExit?: () => void;
}

export class StateMachine {
  private states = new Map<string, State>();
  private currentName = '';
  private current: State | null = null;

  addState(name: string, state: State): this {
    this.states.set(name, state);
    return this;
  }

  transition(name: string): void {
    if (name === this.currentName) return;
    if (!this.states.has(name)) {
      console.warn(`StateMachine: unknown state "${name}"`);
      return;
    }
    this.current?.onExit?.();
    this.currentName = name;
    this.current = this.states.get(name)!;
    this.current.onEnter?.();
  }

  update(delta: number): void {
    this.current?.onUpdate?.(delta);
  }

  get state(): string {
    return this.currentName;
  }
}
