import { API_URL } from '@/config/config'
import axios from 'axios'

export const useAxios = () => {
  const instance = axios.create({
    baseURL: API_URL(),
    timeout: 7000,
    headers: { authorization: 'Bearer ' + localStorage.getItem('token') },
  })
  return instance
}
