"use client";

import { memo } from "react";
import AddTeamForm from "./AddTeamForm";
import TeamsList from "./TeamsList";
import type { Team, Player } from "@/types/tournament-admin";

interface Props {
  teams: Team[];
  format: string;
  divisions: string[];
  draft: boolean;
  confirmRemoveId: number | null;
  onRequestRemove: (id: number | null) => void;
  onConfirmRemove: (id: number) => Promise<void>;
  onAddTeam: (payload: {
    teamName: string;
    seed?: number;
    poolGroup?: string;
    division?: string;
  }) => Promise<void>;
  onAddPlayer: (team: Team, players: Player[]) => Promise<void>;
  onRemovePlayer: (team: Team, players: Player[]) => Promise<void>;
}

function TeamsTab(props: Props) {
  return (
    <div
      id="tabpanel-teams"
      role="tabpanel"
      aria-labelledby="tab-teams"
      className="space-y-4"
    >
      {props.draft && (
        <AddTeamForm
          format={props.format}
          divisions={props.divisions}
          onAdd={props.onAddTeam}
        />
      )}
      <TeamsList
        teams={props.teams}
        draft={props.draft}
        confirmRemoveId={props.confirmRemoveId}
        onRequestRemove={props.onRequestRemove}
        onConfirmRemove={props.onConfirmRemove}
        onAddPlayer={props.onAddPlayer}
        onRemovePlayer={props.onRemovePlayer}
      />
    </div>
  );
}

export default memo(TeamsTab);
