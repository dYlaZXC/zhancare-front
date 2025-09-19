# WebSocket Backend Requirements

## Overview
The frontend now uses WebSocket real-time notifications instead of polling for urgent consultation updates. This requires backend WebSocket implementation.

## Required Backend Implementation

### 1. WebSocket Consumer
Create a Django Channels consumer at `/ws/consultations/`:

```python
# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser

class ConsultationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Add to consultation group
        await self.channel_layer.group_add(
            "consultations",
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Remove from consultation group
        await self.channel_layer.group_discard(
            "consultations",
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data.get('type') == 'authenticate':
            # Authenticate user with token
            user = await self.authenticate_user(data.get('token'))
            self.scope['user'] = user

            # Join role-specific group
            if user.role == 'doctor':
                await self.channel_layer.group_add(
                    "doctors",
                    self.channel_name
                )

    async def consultation_created(self, event):
        """Send consultation_created event to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'consultation_created',
            'data': event['consultation'],
            'timestamp': event.get('timestamp')
        }))

    @database_sync_to_async
    def authenticate_user(self, token):
        # Implement token authentication
        from django.contrib.auth import get_user_model
        from rest_framework.authtoken.models import Token

        try:
            token_obj = Token.objects.get(key=token)
            return token_obj.user
        except Token.DoesNotExist:
            return AnonymousUser()
```

### 2. Routing Configuration
```python
# routing.py
from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/consultations/', consumers.ConsultationConsumer.as_asgi()),
]
```

### 3. Settings Configuration
```python
# settings.py
INSTALLED_APPS = [
    # ... other apps
    'channels',
]

ASGI_APPLICATION = 'your_project.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

### 4. Signal to Send WebSocket Messages
```python
# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Consultation

@receiver(post_save, sender=Consultation)
def consultation_created_signal(sender, instance, created, **kwargs):
    if created and instance.status == 'pending':
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "doctors",  # Send to all doctors
            {
                'type': 'consultation_created',
                'consultation': {
                    'id': instance.id,
                    'meeting_id': instance.meeting_id,
                    'patient_name': instance.patient_name,
                    'patient_email': instance.patient_email,
                    'symptoms': instance.symptoms,
                    'status': instance.status,
                    'created_at': instance.created_at.isoformat(),
                },
                'timestamp': instance.created_at.isoformat()
            }
        )
```

### 5. ASGI Configuration
```python
# asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import your_app.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project.settings')

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter(
            your_app.routing.websocket_urlpatterns
        )
    ),
})
```

## Dependencies Required
```bash
pip install channels
pip install channels-redis
```

## Message Format
The frontend expects WebSocket messages in this format:
```json
{
  "type": "consultation_created",
  "data": {
    "id": 123,
    "meeting_id": "abc-123",
    "patient_name": "John Doe",
    "patient_email": "john@example.com",
    "symptoms": "Headache and fever",
    "status": "pending",
    "created_at": "2024-01-01T12:00:00Z"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Benefits
- ✅ Real-time notifications (no polling)
- ✅ Reduced server load
- ✅ Better user experience
- ✅ Instant urgent consultation alerts
- ✅ Efficient resource usage