import { initializeApp } from 'firebase/app';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyC7XsoY3WggBl2ELWfklEaw_lfvYBrA2DY",
    authDomain: "field-hockey-tactic-board.firebaseapp.com",
    projectId: "field-hockey-tactic-board",
    storageBucket: "field-hockey-tactic-board.firebasestorage.app",
    messagingSenderId: "1016691135552",
    appId: "1:1016691135552:web:ad96f5e44dc256b9b9bba5",
    measurementId: "G-VRZ15PVLC9"
};

const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app);

// Uncomment the following line to use the local emulator during development
// connectFunctionsEmulator(functions, "localhost", 5001);
