-- Enable Realtime publication for fixtures so clients can subscribe to INSERT events
ALTER PUBLICATION supabase_realtime ADD TABLE fixtures;
