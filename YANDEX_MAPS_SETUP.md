# Yandex Maps API Setup Guide

## Getting Your Yandex Maps API Key

### Step 1: Create a Yandex Account
1. Go to https://passport.yandex.ru/registration
2. Create a new Yandex account if you don't have one
3. Verify your email address

### Step 2: Register for Yandex Maps API
1. Visit the Yandex Maps API Console: https://developer.tech.yandex.ru/
2. Click on "Начать пользоваться" (Start using)
3. Log in with your Yandex account

### Step 3: Create a New API Key
1. Go to https://developer.tech.yandex.ru/services/
2. Select "JavaScript API и HTTP Геокодер" (JavaScript API and HTTP Geocoder)
3. Click "Получить ключ" (Get key)
4. Fill in the required information:
   - **Name**: e.g., "ZhanCare Home Appointments"
   - **Website**: Your domain (e.g., zhancareai.com)
   - **Description**: Brief description of your project
5. Click "Создать" (Create)
6. Copy your API key

### Step 4: Add API Key to Your Project
1. Open the file: `/src/components/maps/YandexMap.tsx`
2. Find this line (around line 106):
   ```typescript
   src="https://api-maps.yandex.ru/2.1/?apikey=YOUR_API_KEY&lang=ru_RU"
   ```
3. Replace `YOUR_API_KEY` with your actual API key

**Security Note**: For production, you should store the API key in an environment variable:

#### Option 1: Using Environment Variable (Recommended)
1. Create/update `.env.local` file in your project root:
   ```env
   NEXT_PUBLIC_YANDEX_MAPS_API_KEY=your_actual_api_key_here
   ```

2. Update `YandexMap.tsx`:
   ```typescript
   src={`https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY}&lang=ru_RU`}
   ```

3. Add `.env.local` to your `.gitignore` to prevent committing the key

## API Features Used

The implementation uses these Yandex Maps features:

- ✅ **Interactive Map**: Click and drag to select locations
- ✅ **Geocoding**: Convert addresses to coordinates
- ✅ **Reverse Geocoding**: Convert coordinates to addresses
- ✅ **Draggable Marker**: Users can drag the marker to precise locations
- ✅ **Search Control**: Built-in search functionality
- ✅ **Geolocation Control**: Find user's current location
- ✅ **Zoom Controls**: Zoom in and out

## Testing the Map

1. Start your development server: `npm run dev`
2. Navigate to the "Вызов врача на дом" page
3. Click "Использовать моё местоположение" to get your current location
4. Click "Выбрать на карте" to show the map
5. Click anywhere on the map or drag the marker to select an address
6. The address will automatically populate in the input field

## Troubleshooting

### Map not loading
- Check that your API key is correct
- Verify your domain is registered in the Yandex Console
- Check browser console for error messages

### "Invalid API key" error
- Make sure you copied the entire API key
- Verify the key is activated in the Yandex Console
- Check that you're using the correct API (JavaScript API)

### Map shows wrong location
- The default center is set to Almaty, Kazakhstan: `[43.238293, 76.889709]`
- You can change this in `Step1.tsx` by updating the `mapCenter` state

## API Limits

Yandex Maps API has the following limits for free tier:
- **25,000 map loads per day**
- **25,000 geocoding requests per day**

For higher limits, check: https://yandex.ru/dev/maps/jsapi/doc/2.1/dg/concepts/load.html

## Additional Resources

- [Yandex Maps API Documentation](https://yandex.ru/dev/maps/jsapi/doc/2.1/)
- [Geocoding Examples](https://yandex.ru/dev/maps/jsapi/doc/2.1/ref/reference/geocode.html)
- [Map Events](https://yandex.ru/dev/maps/jsapi/doc/2.1/ref/reference/Map.html#events-summary)

---

**Need Help?** If you encounter any issues, check the [Yandex Maps Forum](https://yandex.ru/support/maps/)
