module.exports = async (request, response) => {
  return response.json({
    body: 'This is a test response',
    query: request.query,
    cookies: request.cookies,
  });
};