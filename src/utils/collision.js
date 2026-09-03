/**
 * Collision detection utility for schedule slots
 */

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function checkTimeCollision(newSlot, existingSlots, excludeId = null, currentParity = null) {
  if (!newSlot || !newSlot.startTime || !newSlot.endTime || !newSlot.dayOfWeek) {
    return { hasCollision: false, collidingLesson: null };
  }

  const newStart = timeToMinutes(newSlot.startTime);
  const newEnd = timeToMinutes(newSlot.endTime);

  if (newEnd <= newStart) {
    return {
      hasCollision: true,
      collidingLesson: null,
      message: "Время окончания должно быть позже времени начала!"
    };
  }

  for (const slot of existingSlots) {
    // Skip checking self when editing
    if (excludeId && slot.id === excludeId) continue;

    // Must be on the same day of week
    if (Number(slot.dayOfWeek) !== Number(newSlot.dayOfWeek)) continue;

    // If specific dates are involved for single events
    if (newSlot.periodicity === 'once' && slot.periodicity === 'once') {
      if (newSlot.specificDate && slot.specificDate && newSlot.specificDate !== slot.specificDate) {
        continue;
      }
    }

    // Parity overlap check if parity is provided
    if (currentParity) {
      const slot1Matches = matchesParity(newSlot.periodicity, currentParity);
      const slot2Matches = matchesParity(slot.periodicity, currentParity);
      if (!slot1Matches || !slot2Matches) continue;
    } else {
      // General check: if one is toq_only and another is juft_only, they won't collide in practice
      if (
        (newSlot.periodicity === 'toq_only' && slot.periodicity === 'juft_only') ||
        (newSlot.periodicity === 'juft_only' && slot.periodicity === 'toq_only')
      ) {
        continue;
      }
    }

    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);

    // Overlap condition: startA < endB && endA > startB
    if (newStart < slotEnd && newEnd > slotStart) {
      return {
        hasCollision: true,
        collidingLesson: slot,
        message: `Внимание! Время пересекается с ${slot.title} (${slot.startTime}-${slot.endTime})`
      };
    }
  }

  return { hasCollision: false, collidingLesson: null, message: null };
}

function matchesParity(periodicity, parity) {
  if (!periodicity || periodicity === 'weekly' || periodicity === 'once') return true;
  if (parity === 'toq' && periodicity === 'toq_only') return true;
  if (parity === 'juft' && periodicity === 'juft_only') return true;
  return false;
}
