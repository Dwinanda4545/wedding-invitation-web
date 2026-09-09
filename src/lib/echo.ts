import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { api } from './api'

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

window.Pusher = Pusher

let echoInstance: Echo<'pusher'> | null = null

export function getEcho(): Echo<'pusher'> | null {
  const key = import.meta.env.VITE_PUSHER_APP_KEY as string | undefined
  const cluster = (import.meta.env.VITE_PUSHER_APP_CLUSTER as string | undefined) || 'ap1'
  if (!key) return null

  if (echoInstance) return echoInstance

  const options = {
    broadcaster: 'pusher' as const,
    key,
    cluster,
    forceTLS: true,
    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: (error: Error | null, data: unknown) => void) => {
        api
          .post('/broadcasting/auth', {
            socket_id: socketId,
            channel_name: channel.name,
          })
          .then((response) => callback(null, response.data))
          .catch((error: Error) => callback(error, null))
      },
    }),
  }

  echoInstance = new Echo(options as ConstructorParameters<typeof Echo<'pusher'>>[0])

  return echoInstance
}
