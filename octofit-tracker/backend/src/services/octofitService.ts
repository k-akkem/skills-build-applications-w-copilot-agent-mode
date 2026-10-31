import { isValidObjectId } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null) {
    throw Object.assign(new Error('Activity details are required'), { status: 400 });
  }

  const { userId, teamId, type, minutes, occurredAt } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !isValidObjectId(userId) ||
    typeof teamId !== 'string' || !isValidObjectId(teamId) ||
    typeof type !== 'string' || type.trim().length === 0 ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) {
    throw Object.assign(new Error('Activity details are invalid'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id'),
    Team.findById(teamId).select('_id'),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  const activityDate = occurredAt === undefined ? new Date() : new Date(occurredAt as string | number);
  if (Number.isNaN(activityDate.getTime())) {
    throw Object.assign(new Error('Activity date is invalid'), { status: 400 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: activityDate,
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null) {
    throw Object.assign(new Error('Team details are required'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' || name.trim().length === 0 ||
    typeof mascot !== 'string' || mascot.trim().length === 0 ||
    !Array.isArray(members) ||
    !members.every((memberId) => typeof memberId === 'string' && isValidObjectId(memberId))
  ) {
    throw Object.assign(new Error('Team details are invalid'), { status: 400 });
  }

  const uniqueMembers = [...new Set(members as string[])];
  const existingMembers = await User.countDocuments({ _id: { $in: uniqueMembers } });
  if (existingMembers !== uniqueMembers.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: uniqueMembers,
  });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const latestActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const activityType = latestActivity?.type.toLowerCase() ?? '';
  const focus = /run|cycle|swim|cardio|endurance/.test(activityType)
    ? 'endurance'
    : /strength|weight|resistance/.test(activityType)
      ? 'strength'
      : user.fitnessGoal;
  const reason = latestActivity
    ? `Recommended based on your ${latestActivity.type} activity and ${focus} focus.`
    : `Recommended for your ${focus} fitness goal.`;
  const workouts = await Workout.find({ focus }).sort({ title: 1 }).lean();

  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
