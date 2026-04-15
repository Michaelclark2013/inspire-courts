"use client";

import { Component, type ReactNode } from "react";
import { Trophy } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class TournamentsErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="py-14 lg:py-20 bg-white" aria-label="Upcoming tournaments">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-14 h-14 bg-red/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-7 h-7 text-red" aria-hidden="true" />
            </div>
            <h2 className="text-navy font-bold text-xl uppercase tracking-tight font-[var(--font-chakra)] mb-2">
              Tournaments Coming Soon
            </h2>
            <p className="text-text-muted text-sm">
              Check back shortly for the next OFF SZN HOOPS event.
            </p>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}
