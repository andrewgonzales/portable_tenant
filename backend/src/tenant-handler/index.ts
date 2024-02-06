exports.handler = async (event: any) => {
  console.log({ event });

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "Authorization, *",
      "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "OPTIONS,GET",
    },
    body: JSON.stringify({}),
  };
};
