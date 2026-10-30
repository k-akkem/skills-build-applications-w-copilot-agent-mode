import { Schema, model } from 'mongoose';

const workoutSchema = new Schema({
  title: String,
  focus: {
    type: String,
    required: [true, 'Workout focus is required'],
  },
  minutes: {
    type: Number,
    required: [true, 'Workout minutes is required'],
  },
  difficulty: {
    type: String,
    required: [true, 'Workout difficulty is required'],
  },
});

export const Workout = model('Workout', workoutSchema);
