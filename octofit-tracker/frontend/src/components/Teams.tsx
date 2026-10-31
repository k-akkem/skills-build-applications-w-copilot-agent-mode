import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  _id?: string;
  name: string;
  mascot?: string;
  members?: unknown[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: result }) => {
        if (active) setTeams(result);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {loading ? <p role="status">Loading teams...</p> : null}
        {error ? <p role="alert">Unable to load teams. Please try again.</p> : null}
        {!loading && !error && teams.length === 0 ? <p>No teams yet.</p> : null}
        {!loading && !error && teams.length > 0 ? (
          <ul className="list-group list-group-flush" aria-label="Teams">
            {teams.map((team, index) => (
              <li className="list-group-item px-0" key={team._id ?? `${team.name}-${index}`}>
                <strong>{team.name}</strong>
                {team.mascot ? <span> · {team.mascot}</span> : null}
                <span> · {team.members?.length ?? 0} members</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
