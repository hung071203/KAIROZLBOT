import mime from 'mime-types';
import {
  GoogleAIFileManager,
  FileState,
  UploadFileResponse,
} from '@google/generative-ai/server';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerativeModel,
  Part,
  Content,
  StartChatParams,
} from '@google/generative-ai';

const fileManager = new GoogleAIFileManager(process.env['GEMINI_API_KEY']);

export async function uploadFile(filePath: string, fileName: string): Promise<
  | UploadFileResponse
  | {
      success: false;
      error: string;
    }
> {
  try {
    const format = mime.lookup(filePath);
    if (!format) {
      return {
        success: false,
        error: `Định dạng File không hợp lệ!, file tên ${fileName}`,
      };
    }

    const uploadResponse = await fileManager.uploadFile(filePath, {
      mimeType: format,
      displayName: fileName,
    });

    const name = uploadResponse.file.name;

    let file = await fileManager.getFile(name);
    while (file.state === FileState.PROCESSING) {
      process.stdout.write('.');
      await new Promise((resolve) => setTimeout(resolve, 10000));
      file = await fileManager.getFile(name);
    }

    if (file.state === FileState.FAILED) {
      return {
        success: false,
        error: 'Upload lỗi!',
      };
    }

    console.log(
      `Uploaded file ${uploadResponse.file.displayName} as: ${uploadResponse.file.uri}`
    );

    return uploadResponse;
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

const genAI = new GoogleGenerativeAI(process.env['GEMINI_API_KEY']);

const generationConfig = {
  temperature: 0.9,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

const model: GenerativeModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-001',
  safetySettings,
  tools: [{ codeExecution: {} }],
});

interface ChatOptions {
  content: string;
  his: Content[];
  filePath?: { file: { mimeType: string; uri: string } }[];
}

export async function chat({
  content,
  his,
  filePath,
}: ChatOptions): Promise<{
  text: string;
  his: Content[];
}> {
  try {
    const chat = model.startChat({
      generationConfig,
      history: his,
    });

    let parts: Part[];
    if (filePath?.length === 1) {
      parts = [
        {
          fileData: {
            mimeType: filePath[0].file.mimeType,
            fileUri: filePath[0].file.uri,
          },
        },
        { text: content },
      ];
    } else if (filePath?.length > 1) {
      parts = [
        { text: content },
        ...filePath.map((f) => ({
          fileData: {
            mimeType: f.file.mimeType,
            fileUri: f.file.uri,
          },
        })),
      ];
    } else {
      parts = [{ text: content }];
    }

    const result = await chat.sendMessage(parts);
    return {
      text: result.response.text(),
      his,
    };
  } catch (error: any) {
    console.error(error);
    return {
      text: error.message,
      his,
    };
  }
}
