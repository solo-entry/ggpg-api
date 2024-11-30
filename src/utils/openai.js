const axios = require('axios');

const generateTagsWithAI = async (description) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/completions',
      {
        model: 'text-davinci-003',
        prompt: `Generate relevant tags for the following project description:\n\n${description}\n\nTags:`,
        max_tokens: 50,
        temperature: 0.5,
        n: 1,
        stop: ['\n'],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const tagsText = response.data.choices[0].text.trim();
    const tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    return tags;
  } catch (error) {
    console.error('Error generating tags with AI:', error.message);
    return [];
  }
};

module.exports = { generateTagsWithAI };
