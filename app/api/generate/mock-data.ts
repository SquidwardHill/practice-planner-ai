import { PracticePlan } from './types';

export const mockPracticePlan: PracticePlan = {
  practice_title: "Varsity Transition Defense Practice",
  total_duration_minutes: 90,
  blocks: [
    {
      time_slot: "0:00 - 0:10",
      drill_name: "3-Man Weave",
      category: "Warmup",
      duration: 10,
      notes: "Focus on crisp passes, no ball hitting the floor. Full court passing drill to get heart rates up."
    },
    {
      time_slot: "0:10 - 0:15",
      drill_name: "Dynamic Stretching",
      category: "Warmup",
      duration: 5,
      notes: "Baseline to baseline lunges, high knees, butt kicks. Focus on proper form."
    },
    {
      time_slot: "0:15 - 0:25",
      drill_name: "Zig-Zag Slide",
      category: "Defense/Conditioning",
      duration: 10,
      notes: "Defensive slides lane-to-lane full court. Focus on turning hips and maintaining low defensive stance."
    },
    {
      time_slot: "0:25 - 0:40",
      drill_name: "Shell Drill",
      category: "Defense",
      duration: 15,
      notes: "4v4 half court. Focus on help-side positioning and defensive rotation. Emphasize 'jumping to the ball' on every pass."
    },
    {
      time_slot: "0:40 - 0:50",
      drill_name: "3v2 to 2v1",
      category: "Transition",
      duration: 10,
      notes: "Fast break drill. Offense attacks 3v2, defense rebounds and goes 2v1 other way. Focus on transition defense positioning."
    },
    {
      time_slot: "0:50 - 1:05",
      drill_name: "11-Man Break",
      category: "Transition",
      duration: 15,
      notes: "Continuous full court layup drill. High intensity conditioning. Work on transition defense and communication."
    },
    {
      time_slot: "1:05 - 1:25",
      drill_name: "Scrimmage (Half Court)",
      category: "Live Play",
      duration: 20,
      notes: "Controlled 5v5 half court with specific constraints. Focus on transition defense principles in live play."
    },
    {
      time_slot: "1:25 - 1:30",
      drill_name: "Free Throws & Water",
      category: "Rest",
      duration: 5,
      notes: "Players shoot 2 free throws and get water. Cool down period."
    }
  ]
};

export function generateMockPracticePlan(prompt: string): PracticePlan {
  // Extract duration from prompt if possible
  const durationMatch = prompt.match(/(\d+)[\s-]*(?:minute|min)/i);
  const requestedDuration = durationMatch ? parseInt(durationMatch[1]) : 90;

  // Create a simplified version based on requested duration
  const blocks = [...mockPracticePlan.blocks];
  
  // Adjust total duration
  const totalDuration = Math.min(requestedDuration, blocks.reduce((sum, block) => sum + block.duration, 0));
  
  // Recalculate time slots
  let currentTime = 0;
  const adjustedBlocks = blocks.map(block => {
    const startMinutes = Math.floor(currentTime / 60);
    const startSeconds = currentTime % 60;
    const endTime = currentTime + block.duration;
    const endMinutes = Math.floor(endTime / 60);
    const endSeconds = endTime % 60;
    
    const timeSlot = `${startMinutes}:${startSeconds.toString().padStart(2, '0')} - ${endMinutes}:${endSeconds.toString().padStart(2, '0')}`;
    currentTime = endTime;
    
    return {
      ...block,
      time_slot: timeSlot
    };
  });

  return {
    practice_title: mockPracticePlan.practice_title,
    total_duration_minutes: totalDuration,
    blocks: adjustedBlocks
  };
}

