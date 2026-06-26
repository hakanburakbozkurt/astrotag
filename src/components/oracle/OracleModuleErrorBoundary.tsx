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
          className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-5 text-center"
        >
          <p className="text-sm leading-relaxed text-amber-100/85">
            {ORACLE_COSMIC_DATA_ERROR}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
