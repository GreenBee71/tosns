from abc import ABC, abstractmethod

class BaseConnector(ABC):
    @abstractmethod
    async def upload(self, file_path: str, title: str, description: str, tags: list, token_data: dict):
        pass

    @abstractmethod
    async def get_account_info(self, token_data: dict):
        pass
