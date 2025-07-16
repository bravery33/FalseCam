import axios from "axios";

const API_BASE = "https://falsecam.onrender.com";

export function getHealth() {
  return axios.get(`${API_BASE}/healthz`);
}

