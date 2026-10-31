import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  _id?: string;
  title: string;
  reason: string;
  focus?: string;
  minutes?: number;
};

const demoUserEmail = 'mona@example.com';

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(demoUserEmail)}`)
      .then(({ suggestions: result }) => {
        if (active) setSuggestions(result);
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
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {loading ? <p role="status">Loading workout suggestions...</p> : null}
        {error ? <p role="alert">Unable to load workout suggestions. Please try again.</p> : null}
        {!loading && !error && suggestions.length === 0 ? <p>No workout suggestions yet.</p> : null}
        {!loading && !error && suggestions.length > 0 ? (
          <ul className="list-group list-group-flush" aria-label="Workout suggestions">
            {suggestions.map((suggestion, index) => (
              <li className="list-group-item px-0" key={suggestion._id ?? `${suggestion.title}-${index}`}>
                <strong>{suggestion.title}</strong>
                {suggestion.focus ? <span> · {suggestion.focus}</span> : null}
                {suggestion.minutes ? <span> · {suggestion.minutes} minutes</span> : null}
                <p className="mb-0">{suggestion.reason}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
