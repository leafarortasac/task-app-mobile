import { useEffect, useState } from 'react';
import mqtt from 'mqtt';

export const useMQTT = (userId: string) => {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);

  useEffect(() => {
    const mqttClient = mqtt.connect('ws://192.168.0.83:9001');

    mqttClient.on('connect', () => {
      console.log('MQTT: Conectado ao Broker');
      mqttClient.subscribe(`notifications/${userId}`);
    });

    mqttClient.on('message', (topic, message) => {
      const payload = JSON.parse(message.toString());
      console.log('Nova Notificação:', payload);
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
    };
  }, [userId]);

  return client;
};