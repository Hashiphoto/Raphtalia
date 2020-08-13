async function clearChannel(channel) {
  let pinnedMessages = await channel.fetchPinnedMessages();
  let fetched;
  do {
    fetched = await channel.fetchMessages({ limit: 100 });
    await channel.bulkDelete(fetched.filter((message) => !message.pinned));
  } while (fetched.size > pinnedMessages.size);
}

export default clearChannel;
