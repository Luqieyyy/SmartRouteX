"use client";

import React from "react";

export default function AssignmentsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Assignments</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Dispatch and manage parcel-to-rider assignments
        </p>
      </div>

      <div className="bg-white border border-gray-200 p-12 text-center">
        <p className="text-sm text-gray-400">
          Assignment management module — under development.
        </p>
        <p className="text-xs text-gray-300 mt-1">
          This module will enable bulk assignment, route optimization, and dispatch control.
        </p>
      </div>
    </div>
  );
}
