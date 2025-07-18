import { v4 as uuidv4 } from 'uuid';

export function getSessionID() {
  let sessionID = localStorage.getItem('sessionID');
  if (!sessionID) {
    sessionID = uuidv4();
    localStorage.setItem('sessionID', sessionID);
  }
  return sessionID;
}
