"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import {
  ORACLE_COSMIC_DATA_ERROR,
  logOracleModuleError,
  type OracleModuleId,
} from "@/lib/oracle/oracle-errors";

type OracleModuleErrorBoundaryProps = {
  module: OracleModuleId;
  children: ReactNode;
};

type OracleModuleErrorBoundaryState = {
  hasError: boolean;
};

export default class OracleModuleErrorBoundary extends Component<
  OracleModuleErrorBoundaryProps,
  OracleModuleErrorBoundaryState
> {
  state: OracleModuleErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): OracleModuleErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logOracleModuleError(this.props.module, error, {
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-xl border border-zinc-700 bg-zinc-900/0.06 px-4 py-5 text-center"
        >
          <p className="text-sm leading-relaxed text-stone-300">
            {ORACLE_COSMIC_DATA_ERROR}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
