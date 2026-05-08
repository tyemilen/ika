import 'dotenv/config';

import { GlideClient } from '@valkey/valkey-glide';

const valkeyIncreaseWTTLFn = `#!lua name=ratelimit_lib
server.register_function('ratelimit_ic', function(keys, args)
    local counter_key = keys[1]
    local timeout_key = keys[2]
    local ttl_seconds = args[1]
    local max_requests = tonumber(args[2])
    local ban_timeout = args[3]

    if server.call("EXISTS", timeout_key) == 1 then
        return -1
    end

    local current_count = server.call("INCR", counter_key)

    if current_count == 1 then
        server.call("EXPIRE", counter_key, ttl_seconds)
    end

    if current_count > max_requests then
        if ban_timeout then
           server.call("SETEX", timeout_key, ban_timeout, "banned") 
        end
    end
    
    return current_count
end)
`;

export default defineNitroPlugin(async (nitroApp) => {
	const config = useRuntimeConfig();
	const valkeyClient = await GlideClient.createClient({
		addresses: [
			{
				host: config.valkeyHost,
				port: config.valkeyPort,
			},
		],
		requestTimeout: 5000,
	});

	await valkeyClient.functionLoad(valkeyIncreaseWTTLFn, {
		replace: true,
	});

	nitroApp.hooks.hook('request', (event) => {
		event.context.valkey = valkeyClient;
	});

	nitroApp.valkey = valkeyClient;
	console.log('[valkey] we good');
});
