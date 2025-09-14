import { Persona } from '@prisma/client';

export interface NotificationMessage {
  title: string;
  body: string;
}

export interface PlantTaskNotification {
  plantName: string;
  taskKey: string;
  persona: Persona;
}

// Message templates for each task type and persona
export const getNotificationMessage = (
  plantName: string,
  taskKey: string,
  persona: Persona
): NotificationMessage => {
  const messages = notificationTemplates[taskKey];
  if (!messages) {
    // Fallback message
    return {
      title: `Care reminder for ${plantName}`,
      body: `Your ${plantName} needs attention today. Tap to mark it done.`
    };
  }

  const personaMessages = messages[persona];
  if (!personaMessages) {
    // Fallback to primary persona
    return messages.PRIMARY;
  }

  // Replace plant name placeholder
  return {
    title: personaMessages.title.replace('{plantName}', plantName),
    body: personaMessages.body.replace('{plantName}', plantName)
  };
};

const notificationTemplates: Record<string, Record<Persona, NotificationMessage>> = {
  watering: {
    PRIMARY: {
      title: "Time to water your {plantName}!",
      body: "Your {plantName} plant needs water today. Tap to mark it done."
    },
    SECONDARY: {
      title: "🌿 Watering time for {plantName}!",
      body: "Team effort needed! Your {plantName} is thirsty. Who's taking care of it today?"
    },
    TERTIARY: {
      title: "✨ Your {plantName} needs a drink!",
      body: "Great job keeping your {plantName} happy! Just a quick watering today."
    }
  },
  fertilizing: {
    PRIMARY: {
      title: "Fertilizer due for {plantName}",
      body: "Your {plantName} is ready for its nutrients. Tap to mark it done."
    },
    SECONDARY: {
      title: "🌱 Feed time for {plantName}!",
      body: "Your {plantName} is hungry for nutrients! Time to give it some plant food."
    },
    TERTIARY: {
      title: "✨ Nourish your {plantName}!",
      body: "Your {plantName} will love the extra nutrients today. You're doing great!"
    }
  },
  spraying: {
    PRIMARY: {
      title: "Misting time for {plantName}",
      body: "Your {plantName} needs humidity. Tap to mark it done."
    },
    SECONDARY: {
      title: "💧 Spritz time for {plantName}!",
      body: "Your {plantName} loves a good misting! Give it some refreshing spray."
    },
    TERTIARY: {
      title: "✨ Mist your {plantName}!",
      body: "A gentle spray will make your {plantName} feel refreshed and happy!"
    }
  },
  pruning: {
    PRIMARY: {
      title: "Pruning due for {plantName}",
      body: "Your {plantName} needs trimming. Tap to mark it done."
    },
    SECONDARY: {
      title: "✂️ Trim time for {plantName}!",
      body: "Your {plantName} is ready for a little haircut! Time to prune those leaves."
    },
    TERTIARY: {
      title: "✨ Shape your {plantName}!",
      body: "A little pruning will help your {plantName} grow even better!"
    }
  },
  sunRotation: {
    PRIMARY: {
      title: "Rotate your {plantName}",
      body: "Your {plantName} needs to be rotated for even growth. Tap to mark it done."
    },
    SECONDARY: {
      title: "🌞 Turn your {plantName}!",
      body: "Give your {plantName} a quarter turn for balanced sunlight exposure!"
    },
    TERTIARY: {
      title: "✨ Rotate your {plantName}!",
      body: "A gentle turn will help your {plantName} grow evenly on all sides!"
    }
  }
};

// Alternative message variations for cycling through multiple overdue tasks
export const getAlternativeNotificationMessage = (
  plantName: string,
  taskKey: string,
  persona: Persona,
  variation: number = 0
): NotificationMessage => {
  const alternativeMessages = alternativeNotificationTemplates[taskKey];
  if (!alternativeMessages) {
    return getNotificationMessage(plantName, taskKey, persona);
  }

  const personaMessages = alternativeMessages[persona];
  if (!personaMessages) {
    return getNotificationMessage(plantName, taskKey, persona);
  }

  const messageIndex = variation % personaMessages.length;
  const message = personaMessages[messageIndex];

  if (!message) {
    // Fallback to primary message if variation is out of bounds
    return getNotificationMessage(plantName, taskKey, persona);
  }

  return {
    title: message.title.replace('{plantName}', plantName),
    body: message.body.replace('{plantName}', plantName)
  };
};

const alternativeNotificationTemplates: Record<string, Record<Persona, NotificationMessage[]>> = {
  watering: {
    PRIMARY: [
      {
        title: "Hydration check for {plantName}",
        body: "Your {plantName} is due for watering. Tap to mark it done."
      },
      {
        title: "Water your {plantName} today",
        body: "Your {plantName} plant needs water. Tap to mark it done."
      },
      {
        title: "Thirsty {plantName} alert",
        body: "Your {plantName} needs a drink. Tap to mark it done."
      }
    ],
    SECONDARY: [
      {
        title: "💧 {plantName} needs water!",
        body: "Your {plantName} is looking thirsty! Time for some H2O."
      },
      {
        title: "🌿 Water {plantName} today!",
        body: "Your {plantName} is ready for its daily drink!"
      },
      {
        title: "💦 {plantName} watering time!",
        body: "Your {plantName} is waiting for some refreshing water!"
      }
    ],
    TERTIARY: [
      {
        title: "✨ {plantName} needs water!",
        body: "Your {plantName} will be so happy after a good watering!"
      },
      {
        title: "💧 Water your {plantName}!",
        body: "A little water will make your {plantName} thrive!"
      },
      {
        title: "🌱 {plantName} watering time!",
        body: "Your {plantName} is ready for some love and water!"
      }
    ]
  },
  fertilizing: {
    PRIMARY: [
      {
        title: "Nutrients due for {plantName}",
        body: "Your {plantName} needs fertilizer. Tap to mark it done."
      },
      {
        title: "Feed your {plantName}",
        body: "Your {plantName} is ready for nutrients. Tap to mark it done."
      },
      {
        title: "Fertilizer time for {plantName}",
        body: "Your {plantName} needs plant food. Tap to mark it done."
      }
    ],
    SECONDARY: [
      {
        title: "🌱 Feed {plantName}!",
        body: "Your {plantName} is hungry for some plant nutrients!"
      },
      {
        title: "🍃 {plantName} needs food!",
        body: "Time to give your {plantName} some delicious fertilizer!"
      },
      {
        title: "🌿 Nourish {plantName}!",
        body: "Your {plantName} is ready for its nutrient boost!"
      }
    ],
    TERTIARY: [
      {
        title: "✨ Feed your {plantName}!",
        body: "Your {plantName} will love the extra nutrients!"
      },
      {
        title: "🌱 {plantName} needs food!",
        body: "A little fertilizer will make your {plantName} super happy!"
      },
      {
        title: "🍃 Nourish {plantName}!",
        body: "Your {plantName} is ready for its special plant meal!"
      }
    ]
  },
  spraying: {
    PRIMARY: [
      {
        title: "Humidity needed for {plantName}",
        body: "Your {plantName} needs misting. Tap to mark it done."
      },
      {
        title: "Spray your {plantName}",
        body: "Your {plantName} needs humidity. Tap to mark it done."
      },
      {
        title: "Mist {plantName} today",
        body: "Your {plantName} needs a spray. Tap to mark it done."
      }
    ],
    SECONDARY: [
      {
        title: "💧 Spritz {plantName}!",
        body: "Your {plantName} loves a refreshing mist!"
      },
      {
        title: "🌿 Mist {plantName}!",
        body: "Give your {plantName} a nice humidity boost!"
      },
      {
        title: "💦 Spray {plantName}!",
        body: "Your {plantName} is ready for a gentle misting!"
      }
    ],
    TERTIARY: [
      {
        title: "✨ Mist your {plantName}!",
        body: "A gentle spray will make your {plantName} feel amazing!"
      },
      {
        title: "💧 {plantName} needs mist!",
        body: "Your {plantName} will love the refreshing humidity!"
      },
      {
        title: "🌿 Spritz {plantName}!",
        body: "A little mist will make your {plantName} super happy!"
      }
    ]
  },
  pruning: {
    PRIMARY: [
      {
        title: "Trim {plantName} today",
        body: "Your {plantName} needs pruning. Tap to mark it done."
      },
      {
        title: "Prune your {plantName}",
        body: "Your {plantName} needs trimming. Tap to mark it done."
      },
      {
        title: "Cut {plantName} back",
        body: "Your {plantName} needs pruning. Tap to mark it done."
      }
    ],
    SECONDARY: [
      {
        title: "✂️ Trim {plantName}!",
        body: "Your {plantName} is ready for a little haircut!"
      },
      {
        title: "🌿 Prune {plantName}!",
        body: "Time to give your {plantName} a nice trim!"
      },
      {
        title: "🍃 Cut {plantName}!",
        body: "Your {plantName} will look great after some pruning!"
      }
    ],
    TERTIARY: [
      {
        title: "✨ Trim your {plantName}!",
        body: "A little pruning will help your {plantName} grow beautifully!"
      },
      {
        title: "✂️ {plantName} needs trimming!",
        body: "Your {plantName} will love the attention and care!"
      },
      {
        title: "🌿 Prune {plantName}!",
        body: "A gentle trim will make your {plantName} even more gorgeous!"
      }
    ]
  },
  sunRotation: {
    PRIMARY: [
      {
        title: "Turn {plantName} today",
        body: "Your {plantName} needs rotation. Tap to mark it done."
      },
      {
        title: "Rotate your {plantName}",
        body: "Your {plantName} needs turning. Tap to mark it done."
      },
      {
        title: "Spin {plantName} around",
        body: "Your {plantName} needs rotation. Tap to mark it done."
      }
    ],
    SECONDARY: [
      {
        title: "🌞 Turn {plantName}!",
        body: "Give your {plantName} a quarter turn for even growth!"
      },
      {
        title: "🔄 Rotate {plantName}!",
        body: "Your {plantName} needs a gentle spin for balanced light!"
      },
      {
        title: "🌿 Turn {plantName}!",
        body: "A little rotation will help your {plantName} grow evenly!"
      }
    ],
    TERTIARY: [
      {
        title: "✨ Rotate your {plantName}!",
        body: "A gentle turn will help your {plantName} grow perfectly!"
      },
      {
        title: "🌞 {plantName} needs turning!",
        body: "Your {plantName} will love the balanced sunlight!"
      },
      {
        title: "🔄 Turn {plantName}!",
        body: "A little rotation will make your {plantName} super happy!"
      }
    ]
  }
};

