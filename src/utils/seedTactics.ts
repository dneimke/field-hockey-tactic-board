import { SavedTactic } from '../types';

/**
 * Default seed tactics for new users (without metadata - metadata is added during seeding)
 * These are pre-configured tactics that help users get started
 */
export const SEED_TACTICS_RAW: Omit<SavedTactic, 'metadata'>[] = [
  {
    id: "3ba2b270-cb52-4b29-b234-be6376889728",
    name: "Red APC with a single battery",
    tags: ["APC"],
    type: "full_scenario",
    positions: [
      { team: "red", role: "GK", relativeIndex: 0, x: 5.697354304852274, y: 48.730474350807484 },
      { team: "red", role: "Player", relativeIndex: 1, x: 96.87497895196805, y: 31.21814237487721 },
      { team: "red", role: "Player", relativeIndex: 2, x: 82.3105514700601, y: 51.167623842021534 },
      { team: "red", role: "Player", relativeIndex: 3, x: 78.93806219107077, y: 48.21999458570811 },
      { team: "red", role: "Player", relativeIndex: 4, x: 34.66472727740898, y: 59.99929374494762 },
      { team: "red", role: "Player", relativeIndex: 5, x: 45.604023531356994, y: 37.479326191077355 },
      { team: "red", role: "Player", relativeIndex: 6, x: 85.63524942297845, y: 30.43610605633023 },
      { team: "red", role: "Player", relativeIndex: 7, x: 60.15380605340505, y: 66.1696103700826 },
      { team: "red", role: "Player", relativeIndex: 8, x: 83.4689517016138, y: 61.22410146379036 },
      { team: "red", role: "Player", relativeIndex: 9, x: 86.84269268657407, y: 69.84268143944882 },
      { team: "red", role: "Player", relativeIndex: 10, x: 82.90227460605088, y: 40.193341530382384 },
      { team: "blue", role: "GK", relativeIndex: 0, x: 96.87497895196805, y: 49.18098186885785 },
      { team: "blue", role: "Player", relativeIndex: 1, x: 100, y: 48 },
      { team: "blue", role: "Player", relativeIndex: 2, x: 96.87497895196805, y: 52.812435398216415 },
      { team: "blue", role: "Player", relativeIndex: 3, x: 96.87497895196805, y: 45.94375832487 },
      { team: "blue", role: "Player", relativeIndex: 4, x: 96.87497895196805, y: 55.742680676732995 },
      { team: "blue", role: "Player", relativeIndex: 5, x: 39.422402067865946, y: 10.112482755935986 },
      { team: "blue", role: "Player", relativeIndex: 6, x: 49.806024317785976, y: 16.98575098239285 },
      { team: "blue", role: "Player", relativeIndex: 7, x: 49.83779380742909, y: 36.23162709178532 },
      { team: "blue", role: "Player", relativeIndex: 8, x: 50, y: 45 },
      { team: "blue", role: "Player", relativeIndex: 9, x: 49.81714661941338, y: 58.89255839951709 },
      { team: "blue", role: "Player", relativeIndex: 10, x: 49.93510500591193, y: 83.68851953191437 }
    ]
  },
  {
    id: "c5796163-0af6-4ee3-8d5f-ce3244bcec00",
    name: "Red APC with double battery",
    tags: ["red", "apc", "double-battery"],
    type: "full_scenario",
    positions: [
      { team: "red", role: "GK", relativeIndex: 0, x: 5.697354304852274, y: 48.730474350807484 },
      { team: "red", role: "Player", relativeIndex: 0, x: 78.37025259962938, y: 53.68910419817616 },
      { team: "red", role: "Player", relativeIndex: 1, x: 96.87497895196805, y: 31.21814237487721 },
      { team: "red", role: "Player", relativeIndex: 2, x: 82.1432639472977, y: 45.45458631432233 },
      { team: "red", role: "Player", relativeIndex: 3, x: 78.57134810461616, y: 42.17275379938969 },
      { team: "red", role: "Player", relativeIndex: 4, x: 38.29019229362781, y: 46.45644327974544 },
      { team: "red", role: "Player", relativeIndex: 5, x: 58.869007360805966, y: 60.45622120066727 },
      { team: "red", role: "Player", relativeIndex: 6, x: 85.63524942297845, y: 30.43610605633023 },
      { team: "red", role: "Player", relativeIndex: 7, x: 89.47886890841643, y: 74.44614324813732 },
      { team: "red", role: "Player", relativeIndex: 8, x: 82.10460411430984, y: 57.81847249215814 },
      { team: "red", role: "Player", relativeIndex: 9, x: 84.27637357891884, y: 65.95823531526858 },
      { team: "blue", role: "GK", relativeIndex: 0, x: 96.87497895196805, y: 49.18098186885785 },
      { team: "blue", role: "Player", relativeIndex: 0, x: 24.269142294709642, y: 84.42021784352895 },
      { team: "blue", role: "Player", relativeIndex: 1, x: 100, y: 48 },
      { team: "blue", role: "Player", relativeIndex: 2, x: 96.87497895196805, y: 52.812435398216415 },
      { team: "blue", role: "Player", relativeIndex: 3, x: 96.87497895196805, y: 45.94375832487 },
      { team: "blue", role: "Player", relativeIndex: 4, x: 96.87497895196805, y: 55.742680676732995 },
      { team: "blue", role: "Player", relativeIndex: 5, x: 39.422402067865946, y: 10.112482755935986 },
      { team: "blue", role: "Player", relativeIndex: 6, x: 49.806024317785976, y: 16.98575098239285 },
      { team: "blue", role: "Player", relativeIndex: 7, x: 49.83779380742909, y: 36.23162709178532 },
      { team: "blue", role: "Player", relativeIndex: 8, x: 50, y: 45 },
      { team: "blue", role: "Player", relativeIndex: 9, x: 49.81714661941338, y: 58.89255839951709 }
    ]
  }
];

