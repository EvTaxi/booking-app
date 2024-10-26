export const formatPhoneNumber = (value) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
  }
  return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

export const validateScheduledTime = (date, time) => {
  const scheduledDateTime = new Date(`${date}T${time}`);
  const scheduledHour = scheduledDateTime.getHours();
  // Between 7PM (19) and 8AM (8)
  return scheduledHour >= 19 || scheduledHour < 8;
};